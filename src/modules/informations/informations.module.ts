import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DirectiveEntity } from '@/shared/database/models/directive.entity'
import { InformationsService } from './informations.service'
import { InformationsController } from './informations.controller'
import { OpenMPEntity } from '@/shared/database/models/openMP.entity'
import { DirectiveOpenMpEntity } from '@/shared/database/models/diretive-open_mp.entity'
import { ImplementancionEntity } from '@/shared/database/models/implementencion.entity'

@Module({
	imports: [
		TypeOrmModule.forFeature([DirectiveEntity, OpenMPEntity, DirectiveOpenMpEntity, ImplementancionEntity])
	],
	providers: [InformationsService],
	controllers: [InformationsController],
	exports: [InformationsService]
})
export class InformationsModule {}
