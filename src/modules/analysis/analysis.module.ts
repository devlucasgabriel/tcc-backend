import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalysisController } from './analysis.controller'
import { AnalysisService } from './analysis.service'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import { CompilerFunctionEntity } from '@/shared/database/models/compiler-function.entity'
import { CompilerImplementancionEntity } from '@/shared/database/models/compiler-implementancion.entity'
import { FunctionEntity } from '@/shared/database/models/function.entity'
import { ImplementancionEntity } from '@/shared/database/models/implementencion.entity'
import { HttpModule } from '@nestjs/axios'
import { GodboltClient } from './godbolt.client'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'
import { DirectiveGompFunctionEntity } from '@/shared/database/models/directive-gomp-function.entity'
@Module({
	imports: [
		HttpModule,
		TypeOrmModule.forFeature([
			CompilerEntity,
			ImplementancionEntity,
			DirectiveEntity,
			DirectiveGompFunctionEntity,
			FunctionEntity,
			CompilerImplementancionEntity,
			CompilerFunctionEntity
		])
	],
	providers: [AnalysisService, GodboltClient],
	controllers: [AnalysisController],
	exports: [AnalysisService]
})
export class AnalysisModule {}
