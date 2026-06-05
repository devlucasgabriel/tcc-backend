import {
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UploadedFile,
	UseInterceptors,
	BadRequestException
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import * as path from 'path'
import { AnalysisService } from './analysis.service'
import { Express } from 'express'

@Controller('analysis')
export class AnalysisController {
	constructor(private readonly analysisService: AnalysisService) {}

	@Post('analyze')
	@HttpCode(HttpStatus.OK)
	@UseInterceptors(
		FileInterceptor('file', {
			limits: { fileSize: 2 * 1024 * 1024 },
			fileFilter: (_req, file, cb) => {
				const allowedExts = ['.c']
				const ext = path.extname(file.originalname).toLowerCase()
				if (!allowedExts.includes(ext)) {
					cb(null, false)
				} else {
					cb(null, true)
				}
			}
		})
	)
	async analyzeOpenMPSource(@UploadedFile() file: Express.Multer.File) {
		if (!file) {
			throw new BadRequestException(
				'Arquivo inválido. Extensões permitidas: .c Tamanho máximo: 2MB'
			)
		}
		return this.analysisService.analysisCode(file)
	}
}
