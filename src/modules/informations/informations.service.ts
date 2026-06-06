import {
	Injectable
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import 'multer'
import { NotFoundException } from '@nestjs/common'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'

@Injectable()
export class InformationsService {
	constructor(
		@InjectRepository(DirectiveEntity)
		private readonly directiveRepository: Repository<DirectiveEntity>
	) {}

	async getDirectiveById(id: number) {
		const directive = await this.directiveRepository.findOne({
			where: { id }
		})

		if (!directive) {
			throw new NotFoundException('Diretiva não encontrada')
		}

		return {
			id: directive.id,
			name: directive.name,
			description: directive.description,
			sintax: directive.sintax
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
