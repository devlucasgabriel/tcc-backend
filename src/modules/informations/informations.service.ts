import {
	Injectable,
	BadRequestException,
	InternalServerErrorException
} from '@nestjs/common'
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
import { NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import { ImplementancionEntity } from '@/shared/database/models/implementencion.entity'
import { CompilerFunctionEntity } from '@/shared/database/models/compiler-function.entity'
import { CompilerImplementancionEntity } from '@/shared/database/models/compiler-implementancion.entity'
import { DirectiveGompFunctionEntity } from '@/shared/database/models/directive-gomp-function.entity'
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
export class InformationsService {
	constructor(
		@InjectRepository(DirectiveEntity)
		private readonly directiveRepository: Repository<DirectiveEntity>,
		@InjectRepository(DirectiveImplementancionEntity)
		private readonly directiveImplementancionRepository: Repository<DirectiveImplementancionEntity>
	) {}

	async getDirectiveById(id: number) {
		const directive = await this.directiveRepository.findOne({
			where: { id }
		})

		if (!directive) {
			throw new NotFoundException('Diretiva não encontrada')
		}

		const sameNameDirectives = await this.directiveRepository.find({
			where: { name: directive.name },
			relations: ['openMP']
		})

		const openMPVersions = Array.from(
			new Set(sameNameDirectives.map((d) => d.openMP?.version).filter(Boolean))
		)

		const directiveImpls = await this.directiveImplementancionRepository.find({
			where: { directiveId: id },
			relations: [
				'implementancion',
				'implementancion.compilerImplementancions',
				'implementancion.compilerImplementancions.compiler'
			]
		})

		return {
			id: directive.id,
			name: directive.name,
			description: directive.description,
			sintax: directive.sintax,
			openMP_versions: openMPVersions
		}
	}

	async getUniqueDirectiveNames() {
		const rows = await this.directiveRepository
			.createQueryBuilder('d')
			.select('MIN(d.id)', 'id')
			.addSelect('d.name', 'name')
			.groupBy('d.name')
			.orderBy('d.name', 'ASC')
			.getRawMany()

		return rows.map((r) => ({ id: Number(r.id), name: r.name }))
	}
}
