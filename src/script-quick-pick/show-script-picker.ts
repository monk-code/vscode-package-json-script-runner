import Fuse from 'fuse.js'
import * as vscode from 'vscode'

import type { PackageInfo } from '#/types/package-info.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'
import type { SelectedScript } from '#/types/selected-script.js'

export const createScriptQuickPickItems = (
  packages: readonly PackageInfo[]
): ScriptQuickPickItem[] => {
  return packages
    .filter(
      (
        pkg
      ): pkg is PackageInfo & {
        name: string
        scripts: Record<string, string>
      } => Boolean(pkg.name && pkg.scripts)
    ) // Only process packages with name and scripts
    .flatMap((pkg) =>
      Object.entries(pkg.scripts).map(([scriptName, scriptCommand]) => ({
        label: scriptName,
        description: pkg.name,
        detail: scriptCommand,
        packageName: pkg.name,
        packagePath: pkg.path,
        scriptName,
        scriptCommand,
      }))
    )
}

const createFuseSearch = (items: readonly ScriptQuickPickItem[]) => {
  return new Fuse(items, {
    keys: ['scriptName'],
    threshold: 0.3,
  })
}

export const showScriptPicker = async (
  packages: readonly PackageInfo[]
): Promise<SelectedScript | undefined> => {
  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick<ScriptQuickPickItem>()
    const allItems = createScriptQuickPickItems(packages)

    quickPick.items = allItems
    quickPick.placeholder =
      packages.length === 0
        ? 'No scripts found in workspace'
        : 'Search for a script to run...'

    // Set up fuzzy search
    const fuse = createFuseSearch(allItems)

    const disposables: vscode.Disposable[] = []

    disposables.push(
      quickPick.onDidChangeValue((value: string) => {
        if (value === '') {
          quickPick.items = allItems
        } else {
          const results = fuse.search(value)
          quickPick.items = results.map((result) => result.item)
        }
      })
    )

    const cleanup = () => {
      disposables.forEach((d) => d?.dispose?.())
      quickPick.dispose()
    }

    disposables.push(
      quickPick.onDidAccept(() => {
        const selection = quickPick.selectedItems[0]
        if (selection) {
          resolve({
            packageName: selection.packageName,
            packagePath: selection.packagePath,
            scriptName: selection.scriptName,
            scriptCommand: selection.scriptCommand,
          })
        } else {
          resolve(undefined)
        }
        cleanup()
      })
    )

    disposables.push(
      quickPick.onDidHide(() => {
        resolve(undefined)
        cleanup()
      })
    )

    quickPick.show()
  })
}
