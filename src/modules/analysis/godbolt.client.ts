import { Inject, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { GODBOLT_URL } from '@/shared/common/constants'
import { firstValueFrom } from 'rxjs'
import { GodBoltExecuteCodeResponse, GodBoltCompilersResponse } from '@/modules/analysis/analysis.types'


@Injectable()
export class GodboltClient {
	constructor(
		@Inject(HttpService)
		private readonly httpService: HttpService
	) {}

	async executeCode(
		code: string,
		compiler: string,
		language: string
	): Promise<GodBoltExecuteCodeResponse> {
		const correctCompiler = language === 'c++' ? compiler.replace('c','') : compiler
		const url = `${GODBOLT_URL}compiler/${correctCompiler}/compile`

		const response = await firstValueFrom(
			this.httpService.post(url, {
				source: code,
				lang: language,
				compiler: correctCompiler,
				allowStoreCodeDebug: true,
				options: {
					userArguments: '-fopenmp -Wunknown-pragmas',
					tools: [],
					libraries: [],
					executeOptions: {
						args: [],
						stdin: ''
					},
					compilerOptions: {
						overrides: [],
						produceCfg: false,
						produceClangir: null,
						produceDevice: false,
						produceGccDump:	{},
						produceIr: null,
						produceLeanC: null,
						produceOptInfo: false,
						produceOptPipeline: null,
						producePp: null,
						produceYul: null
					},
					filters: {
						binary: false,
						binaryObject: false,
						commentOnly: true,
						debugCalls: false,
						demangle: true,
						directives: true,
						execute: false,
						intel: true,
						labels: true,
						libraryCode: true,
						trim: false
					}
				}
			})
		)
		return response.data
	}

	async getCompilers(): Promise<GodBoltCompilersResponse[]> {
		const url = `${GODBOLT_URL}compilers/c`

		const response = await firstValueFrom(this.httpService.get(url))
		return response.data
	}
}
