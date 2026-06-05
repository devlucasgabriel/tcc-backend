import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalysisController } from './analysis.controller'
import { AnalysisService } from './analysis.service'
import { CompilerEntity } from '@/shared/database/models/compiler.entity'
import { CompilerFunctionEntity } from '@/shared/database/models/compiler-function.entity'
import { CompilerImplementancionEntity } from '@/shared/database/models/compiler-implementancion.entity'
import { FunctionEntity } from '@/shared/database/models/function.entity'
import { ImplementancionEntity } from '@/shared/database/models/implementencion.entity'
import { GodboltClient } from './godbolt.client'
import { HttpModule } from '@nestjs/axios'
@Module({
	imports: [
		HttpModule,
		TypeOrmModule.forFeature([
			CompilerEntity,
			ImplementancionEntity,
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
