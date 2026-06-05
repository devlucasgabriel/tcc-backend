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
		compiler: string
	): Promise<GodBoltExecuteCodeResponse> {
		const url = `${GODBOLT_URL}compiler/${compiler}/compile`

		const response = await firstValueFrom(
			this.httpService.post(url, {
				source: code,
				lang: 'C',
				allowStoreCodeDebug: true,
				options: {
					userArguments: '-fopenmp -Wunknown-pragmas',
					filters: {
						binary: false,
						commentOnly: true,
						demangle: true,
						directives: true,
						execute: false,
						intel: true,
						labels: true,
						libraryCode: false,
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
