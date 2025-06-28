export type PackageInfo = {
  readonly path: string
  readonly name?: string
  readonly scripts?: Record<string, string>
}
