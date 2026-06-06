import {
	Controller,
	HttpCode,
	HttpStatus,
	Get,
	Param,
	ParseIntPipe
} from '@nestjs/common'
import { InformationsService } from './informations.service'

@Controller('informations')
export class InformationsController {
	constructor(private readonly informationsService: InformationsService) {}

	@Get('directive/:id')
	@HttpCode(HttpStatus.OK)
	async getDirectiveById(@Param('id', ParseIntPipe) id: number) {
		return this.informationsService.getDirectiveById(id)
	}

	@Get('directives')
	@HttpCode(HttpStatus.OK)
	async getDirectivesNames() {
		return this.informationsService.getUniqueDirectiveNames()
	}
}
