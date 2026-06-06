import { DefaultEntity } from '../default.entity'
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { DirectiveEntity } from './directive.entity'
import { FunctionEntity } from './function.entity'

@Entity('directive_function')
export class DirectiveFunctionEntity extends DefaultEntity<DirectiveFunctionEntity> {
	@PrimaryColumn({ type: 'integer', name: 'directive_id' })
	directiveId: number

	@PrimaryColumn({ type: 'integer', name: 'function_id' })
	functionId: number

	@ManyToOne(
		() => DirectiveEntity,
		(directive) => directive.directiviesFunctions
	)
	@JoinColumn({ name: 'directive_id' })
	directive: DirectiveEntity

	@ManyToOne(
		() => FunctionEntity,
		(gompFunction) => gompFunction.directiviesFunctions
	)
	@JoinColumn({ name: 'function_id' })
	gompFunctions: FunctionEntity
}
