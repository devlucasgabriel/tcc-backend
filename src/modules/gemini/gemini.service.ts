import { GoogleGenAI } from '@google/genai'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { GEMINI_MODEL } from '@/shared/common/constants'

@Injectable()
export class GeminiService {
	constructor(private readonly googleGenAi: GoogleGenAI) {}

	async runAgent(prompt: string): Promise<string | undefined> {
		try {
			const response = await this.googleGenAi.models.generateContent({
				model: GEMINI_MODEL,
				contents: prompt
			})

			return response.text
		} catch (err) {
			throw new InternalServerErrorException(err)
		}
	}
}
