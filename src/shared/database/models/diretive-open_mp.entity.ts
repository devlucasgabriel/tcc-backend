import { DefaultEntity } from '../default.entity'
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { OpenMPEntity } from './openMP.entity'
import { DirectiveEntity } from './directive.entity'

@Entity('diretive_open_mp')
export class DirectiveOpenMpEntity extends DefaultEntity<DirectiveOpenMpEntity> {
	@PrimaryColumn({ type: 'integer', name: 'directive_id' })
	directiveId: number

	@PrimaryColumn({ type: 'integer', name: 'open_mp_id' })
	openMpId: number

	@ManyToOne(
		() => DirectiveEntity,
		(directive) => directive.directiveOpenMps
	)
	@JoinColumn({ name: 'directive_id' })
	directive: DirectiveEntity

	@ManyToOne(
		() => OpenMPEntity,
		(openMp) => openMp.directiveOpenMps
	)
	@JoinColumn({ name: 'open_mp_id' })
	openMp: OpenMPEntity
}
