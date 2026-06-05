import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GeminiService } from '../gemini/gemini.service'
import { OpenMPVersionsPrompt } from '../gemini/prompts/openMPVersion.prompt'
import { DirectivesPrompt } from '../gemini/prompts/directives.prompt'
import { Octokit } from '@octokit/rest'
import 'multer'
import fs from 'fs'
import readline from 'readline'
import path from 'path'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import { ImplementancionEntity } from '@/shared/database/models/implementencion.entity'
import { CompilerFunctionEntity } from '@/shared/database/models/compiler-function.entity'
import { CompilerImplementancionEntity } from '@/shared/database/models/compiler-implementancion.entity'
import { DirectiveImplementancionEntity } from '@/shared/database/models/directive-implementancion.entity'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'
import { FunctionEntity } from '@/shared/database/models/function.entity'
import { OpenMPEntity } from '@/shared/database/models/openMP.entity'

interface CompilerData {
	com_nome: string
	com_versao: string
	implementacoes: {
		imp_nome: string
		imp_versao: string
		funcoes: string[]
	}[]
}

@Injectable()
export class CronService {
	constructor(
		private readonly geminiService: GeminiService,
		@InjectRepository(CompilerEntity)
		private readonly compilerRepository: Repository<CompilerEntity>,
		@InjectRepository(ImplementancionEntity)
		private readonly implementancionRepository: Repository<ImplementancionEntity>,
		@InjectRepository(FunctionEntity)
		private readonly functionRepository: Repository<FunctionEntity>,
		@InjectRepository(CompilerImplementancionEntity)
		private readonly compilerImplementancionRepository: Repository<CompilerImplementancionEntity>,
		@InjectRepository(CompilerFunctionEntity)
		private readonly compilerFunctionRepository: Repository<CompilerFunctionEntity>,
		@InjectRepository(OpenMPEntity)
		private readonly openMPRepository: Repository<OpenMPEntity>,
		@InjectRepository(DirectiveEntity)
		private readonly directiveRepository: Repository<DirectiveEntity>,
		@InjectRepository(DirectiveImplementancionEntity)
		private readonly directiveImplementancionRepository: Repository<DirectiveImplementancionEntity>,
	) {}

	@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
	async getGccVersions() {
		const regexBranch = /^releases\/gcc-\d+(?:\.\d+)*$/
		const regexInicioGomp = /^GOMP_\d+(?:\.\d+)*\s\{$/
		const regexFimBloco = /^\s*};|\}\s(OMP|GOMP)_\d+(?:\.\d+)*;$/
		const resultado: CompilerData[] = []
		const outputDir = path.join(process.cwd(), 'libgompMaps')

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		const octokit = new Octokit()
		const branches = await octokit.paginate<any>(
			'GET /repos/gcc-mirror/gcc/branches'
		)

		for (const branch of branches) {
			if (!branch.name || !regexBranch.test(branch.name)) {
				continue
			}

			const subString = branch.name.split('/')[1]
			const [comNome, comVersao] = subString.split('-')

			const compilador: CompilerData = {
				com_nome: comNome,
				com_versao: comVersao,
				implementacoes: []
			}

			console.log(`\nProcessando ${subString}...`)

			try {
				const url = `https://raw.githubusercontent.com/gcc-mirror/gcc/releases/${subString}/libgomp/libgomp.map`
				const response = await fetch(url)

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`)
				}

				const data = await response.text()
				const filePath = path.join(outputDir, `${subString}-libgomp.map`)
				fs.writeFileSync(filePath, data, 'utf8')

				const rl = readline.createInterface({
					input: fs.createReadStream(filePath),
					crlfDelay: Infinity
				})

				let currentImp: CompilerData['implementacoes'][number] | null = null

				for await (const rawLine of rl) {
					const line = rawLine.trim()

					if (regexInicioGomp.test(line)) {
						const bloco = line.replace(' {', '')
						const [impNome, ...versaoParts] = bloco.split('_')
						const impVersao = versaoParts.join('_')

						currentImp = {
							imp_nome: impNome,
							imp_versao: impVersao,
							funcoes: []
						}

						compilador.implementacoes.push(currentImp)
						continue
					}

					if (regexFimBloco.test(line)) {
						currentImp = null
						continue
					}

					if (currentImp && line.endsWith(';') && !line.startsWith('#')) {
						const funNome = line.replace(';', '').trim()
						currentImp.funcoes.push(funNome)
					}
				}

				resultado.push(compilador)
			} catch (error) {
				console.error(
					`Erro ao processar ${subString}:`,
					error instanceof Error ? error.message : error
				)
			}
		}

		fs.writeFileSync(
			path.join(process.cwd(), 'resultado.json'),
			JSON.stringify(resultado, null, 4),
			'utf8'
		)

		console.log('\nArquivo resultado.json criado com sucesso.')
		this.processAndInsertData()
	}

	private async processAndInsertData() {
		try {
			const filePath = path.join(process.cwd(), 'resultado.json')
			const fileBuffer = fs.readFileSync(filePath)
			const data = JSON.parse(fileBuffer.toString()) as CompilerData[]

			const results = []

			for (const compilerData of data) {
				const compiler = await this.compilerRepository.findOne({
					where: {
						name: compilerData.com_nome,
						version: compilerData.com_versao
					}
				})

				let compilerId: number

				if (compiler) {
					compilerId = compiler.id
				} else {
					const newCompiler = this.compilerRepository.create({
						name: compilerData.com_nome,
						version: compilerData.com_versao
					})
					const savedCompiler = await this.compilerRepository.save(newCompiler)
					compilerId = savedCompiler.id
				}

				for (const impl of compilerData.implementacoes) {
					let implementancion = await this.implementancionRepository.findOne({
						where: {
							name: impl.imp_nome,
							version: impl.imp_versao
						}
					})

					let implementancionId: number

					if (!implementancion) {
						implementancion = this.implementancionRepository.create({
							name: impl.imp_nome,
							version: impl.imp_versao
						})
						const savedImpl =
							await this.implementancionRepository.save(implementancion)
						implementancionId = savedImpl.id
					} else {
						implementancionId = implementancion.id
					}

					const existingRelation =
						await this.compilerImplementancionRepository.findOne({
							where: {
								compilerId,
								implementancionId
							}
						})

					if (!existingRelation) {
						const relation = this.compilerImplementancionRepository.create({
							compilerId,
							implementancionId
						})
						await this.compilerImplementancionRepository.save(relation)
					}

					for (const funcName of impl.funcoes) {
						if (funcName === '*') {
							continue
						}

						let func = await this.functionRepository.findOne({
							where: {
								name: funcName,
								implementicionId: implementancionId
							}
						})

						let functionId: number

						if (!func) {
							func = this.functionRepository.create({
								name: funcName,
								implementicionId: implementancionId
							})
							const savedFunc = await this.functionRepository.save(func)
							functionId = savedFunc.id
						} else {
							functionId = func.id
						}

						const existingFuncRelation =
							await this.compilerFunctionRepository.findOne({
								where: {
									compilerId,
									functionId
								}
							})

						if (!existingFuncRelation) {
							const funcRelation = this.compilerFunctionRepository.create({
								compilerId,
								functionId
							})
							await this.compilerFunctionRepository.save(funcRelation)
						}
					}
				}

				results.push({
					compiler: compilerData.com_nome,
					version: compilerData.com_versao,
					implementacoes: compilerData.implementacoes.length,
					status: 'Inserido com sucesso'
				})
			}

			console.log({
				sucesso: true,
				mensagem: `${data.length} compilador(es) processado(s) com sucesso`,
				detalhes: results
			})
			this.getOpenMPVersions()
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new BadRequestException('Arquivo JSON inválido')
			}
			throw error
		}
	}

	private async getOpenMPVersions() {
		const response = await this.geminiService.runAgent(OpenMPVersionsPrompt)

		if (!response) {
			return
		}

		const versions = JSON.parse(response) as {
			version: string
			pdf_url: string
		}[]

		for (const versionData of versions) {
			const existingVersion = await this.openMPRepository.findOne({
				where: {
					version: versionData.version
				}
			})

			if (existingVersion) {
				continue
			}

			await this.openMPRepository.save({
				version: versionData.version,
				pdf_url: versionData.pdf_url
			})
		}

		return this.getDirectives()
	}

	private async getDirectives() {
		const versions = await this.openMPRepository.find()
		const directivesImplementancion: { id: number; gompFunction: string }[] = []

		for (const version of versions) {
			const response = await this.geminiService.runAgent(
				DirectivesPrompt(version.version, version.pdf_url)
			)
			if (!response) {
				continue
			}
			const directives = JSON.parse(response) as {
				version: string
				directives: {
					name: string
					description: string
					c_syntax: string
					GOMP_function: string
				}[]
			}
			console.log(directives)
			for (const directive of directives.directives) {
				const directiveExists = await this.directiveRepository.findOne({
					where: {
						name: directive.name,
						openMPId: version.id
					}
				})

				if (directiveExists) {
					continue
				}

				const createdDirective = await this.directiveRepository.save({
					name: directive.name,
					description: directive.description,
					sintax: directive.c_syntax,
					openMPId: version.id
				})

				const implementancion = await this.implementancionRepository.findOne({
					where: {
						name: 'OMP',
						version: version.version
					}
				})

				if (implementancion) {
					await this.directiveImplementancionRepository.save({
						directiveId: createdDirective.id,
						implementancionId: implementancion.id
					})
				}
			}

			await new Promise((resolve) => setTimeout(resolve, 10000))
		}

		console.log('Diretivas inseridas com sucesso')
	}
}
