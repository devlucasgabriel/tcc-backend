export type AsmCode = {
	text: string
	source: any
	labels: any[]
}
export type GodBoltExecuteCodeResponse = {
	stderr: { text: string }[]
	asm: AsmCode[]
}

export type GodBoltCompilersResponse = {
	id: string
	name: string
	lang: string
	compilerType: string
	semver: string
	instructionSet: string
}

export type GetGompCalls = {
	gompFunction: string
	ocorrences: number
}

export type GetGodBoltCompilerGccVersions = {
	gccVersion: string
	compilerId: string
}

export type CodeAnalysisResult = {
	gccVersion: string
	calls: GetGompCalls[]
	compatible: boolean
}

export type CodeAnalysisResults = {
	fileName: string
	results: CodeAnalysisResult[]
}

export type GodBoltFiles = {
	filename: string
	contents: string
}