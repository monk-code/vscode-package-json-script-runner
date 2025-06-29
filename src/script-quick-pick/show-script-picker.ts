import Fuse from 'fuse.js'
import * as vscode from 'vscode'
import type { PackageInfo } from '#/types/package-info.js'
import type { RecentCommandsManager } from '#/recent-commands/recent-commands-manager.js'
import type { ScriptQuickPickItem } from '#/types/script-quick-pick-item.js'
import type { SelectedScript } from '#/types/selected-script.js'
import { createRecentQuickPickItems } from '#/recent-commands/create-recent-quick-pick-items.js'

const MAX_SEARCH_LENGTH = 200
// Threshold of 0.15 prevents typos like "startt" from matching "start" while still allowing reasonable fuzzy matches
const FUZZY_SEARCH_THRESHOLD = 0.15

const createNoResultsItem = (): ScriptQuickPickItem => ({
  label: '$(search) No scripts found',
  description: 'Try adjusting your search terms',
  alwaysShow: true,
  detail: '',
  packageName: '',
  packagePath: '',
  scriptName: '',
  scriptCommand: '',
})

const validateSearchInput = (input: string): string =>
  input.length > MAX_SEARCH_LENGTH ? input.slice(0, MAX_SEARCH_LENGTH) : input

const matchesAllSearchTerms = (
  text: string,
  searchTerms: readonly string[]
): boolean => {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/[\s\-_@/:]+/)

  return searchTerms.every((term) => {
    const lowerTerm = term.toLowerCase()
    return words.some((word) => word.startsWith(lowerTerm))
  })
}

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
    )
    .flatMap((pkg) =>
      Object.entries(pkg.scripts).map(([scriptName, scriptCommand]) => ({
        label: `${scriptName} (${pkg.name})`,
        description: '',
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
    keys: ['scriptName', 'packageName'],
    threshold: FUZZY_SEARCH_THRESHOLD,
  })
}

export const performSearch = (
  searchValue: string,
  allItems: readonly ScriptQuickPickItem[],
  fuse: Fuse<ScriptQuickPickItem>
): ScriptQuickPickItem[] => {
  const validatedValue = validateSearchInput(searchValue)
  const trimmedValue = validatedValue.trim()

  if (trimmedValue === '') {
    return [...allItems]
  }

  const rawTerms = trimmedValue.split(/\s+/).filter((term) => term.length > 0)

  const searchTerms = rawTerms
    .flatMap((term) => {
      return term.split(/[@/:_-]+/).filter((part) => part.length > 0)
    })
    .filter((term) => term.length > 0)

  if (searchTerms.length === 0) {
    return [createNoResultsItem()]
  }

  let results: ScriptQuickPickItem[] = []

  if (searchTerms.length === 1) {
    try {
      const fuseResults = fuse.search(searchTerms[0])
      results = fuseResults.map((result) => result.item)
    } catch {
      results = []
    }
  } else {
    results = allItems.filter((item) => {
      const itemText = `${item.scriptName} ${item.packageName}`
      return matchesAllSearchTerms(itemText, searchTerms)
    })
  }

  if (results.length === 0) {
    return [createNoResultsItem()]
  }

  return results
}

export const showScriptPicker = async (
  packages: readonly PackageInfo[],
  workspaceRoot?: string,
  recentCommandsManager?: RecentCommandsManager
): Promise<SelectedScript | undefined> => {
  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick<
      ScriptQuickPickItem | vscode.QuickPickItem
    >()

    quickPick.busy = true
    quickPick.placeholder = 'Loading scripts...'

    const allItems = createScriptQuickPickItems(packages)
    let recentItems: Array<ScriptQuickPickItem | vscode.QuickPickItem> = []

    quickPick.items = allItems
    quickPick.title = 'Run npm Script'
    quickPick.placeholder =
      packages.length === 0
        ? 'No scripts found in workspace'
        : 'Search for a script to run...'
    quickPick.matchOnDescription = false
    quickPick.busy = false

    const fuse = createFuseSearch(allItems)

    const updateQuickPickItems = () => {
      const searchValue = quickPick.value || ''
      if (searchValue.trim() === '') {
        quickPick.items = [...recentItems, ...allItems]
      } else {
        quickPick.items = performSearch(searchValue, allItems, fuse)
      }
    }

    // Load recent commands if manager is provided
    if (recentCommandsManager && workspaceRoot) {
      recentCommandsManager
        .getValidatedRecentCommands(workspaceRoot)
        .then((recentCommands) => {
          recentItems = createRecentQuickPickItems(recentCommands)
          updateQuickPickItems()
        })
        .catch(() => {
          updateQuickPickItems()
        })
    }

    const disposables: vscode.Disposable[] = []

    disposables.push(
      quickPick.onDidChangeValue((value: string) => {
        // Use async update to ensure VS Code QuickPick UI refreshes properly
        // This is a workaround for a VS Code issue where synchronous updates
        // to items within onDidChangeValue don't always trigger a UI refresh
        Promise.resolve().then(() => {
          try {
            if (value.trim() === '' && recentItems.length > 0) {
              quickPick.items = [...recentItems, ...allItems]
            } else {
              quickPick.items = performSearch(value, allItems, fuse)
            }
          } catch {
            quickPick.items = [createNoResultsItem()]
          }
        })
      })
    )

    const cleanup = () => {
      disposables.forEach((d) => d?.dispose?.())
      quickPick.dispose()
    }

    disposables.push(
      quickPick.onDidAccept(() => {
        const selection = quickPick.selectedItems[0]
        if (
          selection &&
          'scriptName' in selection &&
          'scriptCommand' in selection
        ) {
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
