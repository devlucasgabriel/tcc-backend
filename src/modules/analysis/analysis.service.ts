import { BadRequestException, Injectable } from '@nestjs/common'
import 'multer'
import { InjectRepository } from '@nestjs/typeorm'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import {Repository } from 'typeorm'
import {
	AsmCode,
	CodeAnalysisResult,
	GetGodBoltCompilerGccVersions,
	GetGompCalls
} from './analysis.types'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'
import { FunctionEntity } from '@/shared/database/models/function.entity'
import { GodboltClient } from './godbolt.client'
import { DirectiveFunctionEntity } from '@/shared/database/models/directive-function.entity'

@Injectable()
export class AnalysisService {
	constructor(
		private readonly godBoltClient: GodboltClient,
		@InjectRepository(CompilerEntity)
		private readonly compilerRepository: Repository<CompilerEntity>,
		@InjectRepository(DirectiveEntity)
		private readonly directiveRepository: Repository<DirectiveEntity>,
		@InjectRepository(DirectiveFunctionEntity)
		private readonly directiveFunctionRepository: Repository<DirectiveFunctionEntity>,
		@InjectRepository(FunctionEntity)
		private readonly functionRepository: Repository<FunctionEntity>
	) {}

	async connectDiretiveToGompFunction(file: Express.Multer.File, directiveId: number): Promise<void> {
		const godBoltCompilers = await this.getGodBoltCompilersIds()
			
		const code = file.buffer.toString('utf-8')
				
		const callsToGomp = new Set<string>()
	
		for (const compiler of godBoltCompilers) {
			const compilerResponse = await this.godBoltClient.executeCode(
				code,
				compiler.compilerId
			)
	
			if (compilerResponse.stderr.length > 0) {
				continue
			} 
				
			const gompCalls = this.getGompCallsFromCompilerResponse(
				compilerResponse.asm
			)

			gompCalls.forEach((call) => callsToGomp.add(call.gompFunction))
	
			await new Promise((resolve) => setTimeout(resolve, 200))
		}

		const diretive = await this.directiveRepository.findOne({
			where: {
				id: directiveId
			}
		})

		if (!diretive) {
			throw new BadRequestException('Diretiva não encontrada')
		}

		for (const gompFunction of callsToGomp) {
			const func = await this.functionRepository.findOne({
				where: {
					name: gompFunction
				}
			})

			if (!func) {
				continue
			}

			const existingRelation = await this.directiveFunctionRepository.findOne({
				where: {
					directiveId: diretive.id,
					functionId: func.id
				}
			})

			if (!existingRelation) {
				await this.directiveFunctionRepository.save({
					directiveId: diretive.id,
					functionId: func.id
				})
			}
		}		
	}

	async analysisCode(file: Express.Multer.File): Promise<CodeAnalysisResult[]> {
		if (!['text/x-c', 'text/x-csrc'].includes(file.mimetype)) {
			console.log(file.mimetype)
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
						(error: { text: string }) =>
							error.text.includes('ignoring #pragma omp') ||
							error.text.includes('[-Wunknown-pragmas]')
					)
				) {
					results.push({
						gccVersion: compiler.gccVersion,
						calls: [],
						compatible: false
					})
				} else {
					console.log(compilerResponse.stderr)
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

			await new Promise((resolve) => setTimeout(resolve, 200))
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
				return this.modifyGccVersions4x(compiler.version)
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
			gompFunction: func,
			ocorrences: count
		}))
	}


	private modifyGccVersions4x(version: string): string {
		switch (version) {
			case '4.4':
				return '4.4.7'
			case '4.5':
				return '4.5.3'
			case '4.6':
				return '4.6.4'
			case '4.7':
				return '4.7.1'
			case '4.8':
				return '4.8.1'
			case '4.9':
				return '4.9.1'
			default:
				return version
		}
	}
}
