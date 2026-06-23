import {
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UploadedFiles,
	UseInterceptors,
	BadRequestException,
	Body
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import * as path from 'path'
import { AnalysisService } from './analysis.service'
import { Express } from 'express'

@Controller('analysis')
export class AnalysisController {
	constructor(private readonly analysisService: AnalysisService) {}

	@Post('analyze')
	@HttpCode(HttpStatus.OK)
	@UseInterceptors(
		FilesInterceptor('files', 12, {
			limits: { fileSize: 2 * 1024 * 1024 },
			fileFilter: (_req, file, cb) => {
				const allowedExts = ['.c', '.h', '.cpp']
				const ext = path.extname(file.originalname).toLowerCase()
				if (!allowedExts.includes(ext)) {
					cb(null, false)
				} else {
					cb(null, true)
				}
			}
		})
	)
	async analyzeOpenMPSource(@UploadedFiles() files: Express.Multer.File[]) {
		if (!files || files.length === 0) {
			throw new BadRequestException(
				'Arquivo inválido. Extensões permitidas: .c, .h - Tamanho máximo: 2MB'
			)
		}

		return this.analysisService.analysisCode(files)
	}

	@Post('gomp')
	@HttpCode(HttpStatus.OK)
	@UseInterceptors(
		FilesInterceptor('file', 3, {
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
	async analyzeGompFunctions(
		@UploadedFiles() files: Express.Multer.File[],
		@Body('directiveId') directiveId: number
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException(
				'Arquivo inválido. Extensões permitidas: .c Tamanho máximo: 2MB'
			)
		}

		return Promise.all(
			files.map((file) =>
				this.analysisService.connectDiretiveToGompFunction(file, directiveId)
			)
		)
	}
}
