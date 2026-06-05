import { BadRequestException, Injectable } from '@nestjs/common'
import { GodboltClient } from './godbolt.client'
import 'multer'
import { InjectRepository } from '@nestjs/typeorm'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import { Repository } from 'typeorm'
import {
	AsmCode,
	CodeAnalysisResult,
	GetGodBoltCompilerGccVersions,
	GetGompCalls
} from './analysis.types'

@Injectable()
export class AnalysisService {
	constructor(
		private readonly godBoltClient: GodboltClient,
		@InjectRepository(CompilerEntity)
		private readonly compilerRepository: Repository<CompilerEntity>
	) {}

	async analysisCode(file: Express.Multer.File): Promise<CodeAnalysisResult[]> {
		if (file.mimetype !== 'text/x-c') {
			throw new BadRequestException('Tipo de arquivo inválido')
		}

		const godBoltCompilers = await this.getGodBoltCompilersIds()

		const code = file.buffer.toString('utf-8')

		const results: CodeAnalysisResult[] = []

		for (const compiler of godBoltCompilers) {
			const compilerResponse = await this.godBoltClient.executeCode(
				code,
				compiler.compilerId
			)

			if (compilerResponse.stderr.length > 0) {
				if (
					compilerResponse.stderr.some(
						(error) =>
							error.text.includes('ignoring #pragma omp') &&
							error.text.includes('[-Wunknown-pragmas]')
					)
				) {
					results.push({
						gccVersion: compiler.gccVersion,
						calls: [],
						compatible: false
					})
				} else {
					throw new BadRequestException('Erro durante a compilação do código')
				}
			} else {
				const gompCalls = this.getGompCallsFromCompilerResponse(
					compilerResponse.asm
				)

				results.push({
					gccVersion: compiler.gccVersion,
					calls: gompCalls,
					compatible: true
				})
			}

			await new Promise((resolve) => setTimeout(resolve, 1000))
		}

		return results
	}

	private async getGodBoltCompilersIds(): Promise<
		GetGodBoltCompilerGccVersions[]
	> {
		const godBoltCompilers = await this.godBoltClient.getCompilers()
		const gccVersions = await this.compilerRepository.find()

		const modifyGccVersions = gccVersions.map((compiler) => {
			if (compiler.version[0] === '4') {
				return `${compiler.version}.5`
			}
			return `${compiler.version}.1`
		})

		const compilerIds = godBoltCompilers
			.filter((compiler) =>
				compiler.name.match(/^x86-64 gcc (\d+)\.(\d+)(?:\.(\d+))?$/)
			)
			.filter((compiler) => {
				return modifyGccVersions.includes(compiler.semver)
			})
			.sort((a, b) => {
				const aVersion = a.semver.split('.').map(Number)
				const bVersion = b.semver.split('.').map(Number)

				for (let i = 0; i < 3; i++) {
					if ((aVersion[i] || 0) > (bVersion[i] || 0)) return -1
					if ((aVersion[i] || 0) < (bVersion[i] || 0)) return 1
				}
				return 0
			})

		return compilerIds.map((compiler) => {
			return {
				compilerId: compiler.id,
				gccVersion: `GCC ${compiler.semver}`
			}
		})
	}

	private getGompCallsFromCompilerResponse(asmCode: AsmCode[]): GetGompCalls[] {
		const gompCallCounts = new Map<string, number>()

		asmCode.forEach((line) => {
			const match = line.text.trim().match(/call\s+"?(GOMP_[^"]+)"?/)
			if (match) {
				const gompFunction = match[1]
				const currentCount = gompCallCounts.get(gompFunction) || 0
				gompCallCounts.set(gompFunction, currentCount + 1)
			}
		})

		return Array.from(gompCallCounts, ([func, count]) => ({
			function: func,
			ocorrences: count
		}))
	}
}
