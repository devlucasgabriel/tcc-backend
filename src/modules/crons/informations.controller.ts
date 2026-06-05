import {
	Controller,
	HttpCode,
	HttpStatus,
	Get,
	Param,
	ParseIntPipe,
	Post
} from '@nestjs/common'
import { CronService } from './cron.service'

@Controller('cron')
export class CronController {
	constructor(private readonly cronService: CronService) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	async getDirectiveById() {
		return this.cronService.getGccVersions()
	}
}
