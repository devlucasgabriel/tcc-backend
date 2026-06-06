import { DefaultEntity } from '../default.entity'
import {
	Column,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	Unique
} from 'typeorm'
import { DirectiveFunctionEntity } from './directive-function.entity'
import { DirectiveOpenMpEntity } from './diretive-open_mp.entity'

@Entity('directive')
@Unique(['name'])
export class DirectiveEntity extends DefaultEntity<DirectiveEntity> {
	@PrimaryGeneratedColumn('identity')
	id: number

	@Column({ type: 'varchar' })
	name: string

	@Column({ type: 'varchar' })
	description: string

	@Column({ type: 'text' })
	sintax: string

	@OneToMany(
		() => DirectiveFunctionEntity,
		(directiveFunction) => directiveFunction.directive
	)
	directiviesFunctions: DirectiveFunctionEntity[]

	@OneToMany(
		() => DirectiveOpenMpEntity,
		(directiveOpenMp) => directiveOpenMp.directive
	)
	directiveOpenMps: DirectiveOpenMpEntity[]
}
