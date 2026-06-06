import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GeminiModule } from '../gemini/gemini.module'
import { CronService } from './cron.service'
import { CompilerFunctionEntity } from '@/shared/database/models/compiler-function.entity'
import { CompilerImplementancionEntity } from '@/shared/database/models/compiler-implementancion.entity'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'
import { FunctionEntity } from '@/shared/database/models/function.entity'
import { ImplementancionEntity } from '@/shared/database/models/implementencion.entity'
import { OpenMPEntity } from '@/shared/database/models/openMP.entity'
import { CronController } from './cron.controller'
import { DirectiveFunctionEntity } from '@/shared/database/models/directive-function.entity'
import { DirectiveOpenMpEntity } from '@/shared/database/models/diretive-open_mp.entity'

@Module({
	imports: [
		GeminiModule,
		TypeOrmModule.forFeature([
			CompilerEntity,
			ImplementancionEntity,
			FunctionEntity,
			CompilerImplementancionEntity,
			CompilerFunctionEntity,
			OpenMPEntity,
			DirectiveEntity,
			DirectiveFunctionEntity,
			DirectiveOpenMpEntity,
		])
	],
	providers: [CronService],
	controllers: [CronController],
	exports: [CronService]
})
export class CronModule {}
