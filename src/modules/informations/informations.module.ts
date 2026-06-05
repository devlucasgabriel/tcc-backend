import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DirectiveImplementancionEntity } from '@/shared/database/models/directive-implementancion.entity'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'
import { InformationsService } from './informations.service'
import { InformationsController } from './informations.controller'

@Module({
	imports: [
		TypeOrmModule.forFeature([DirectiveEntity, DirectiveImplementancionEntity])
	],
	providers: [InformationsService],
	controllers: [InformationsController],
	exports: [InformationsService]
})
export class InformationsModule {}
