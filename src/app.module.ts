import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
	DATABASE,
	DATABASE_HOST,
	DATABASE_PASSWORD,
	DATABASE_PORT,
	DATABASE_USER,
	DB_USE
} from './shared/common/constants'
import { AnalysisModule } from './modules/analysis/analysis.module'
import { CompilerEntity } from './shared/database/models/compiler.entity'
import { ImplementancionEntity } from './shared/database/models/implementencion.entity'
import { FunctionEntity } from './shared/database/models/function.entity'
import { CompilerImplementancionEntity } from './shared/database/models/compiler-implementancion.entity'
import { CompilerFunctionEntity } from './shared/database/models/compiler-function.entity'
import { DirectiveEntity } from './shared/database/models/directive.entity'
import { OpenMPEntity } from './shared/database/models/openMP.entity'
import { CronModule } from './modules/crons/cron.module'
import { InformationsModule } from './modules/informations/informations.module'
import { DirectiveFunctionEntity } from './shared/database/models/directive-function.entity'
import { DirectiveOpenMpEntity } from './shared/database/models/diretive-open_mp.entity'
@Module({
	imports: [
		AnalysisModule,
		CronModule,
		InformationsModule,
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async () => ({
				type: DB_USE,
				host: DATABASE_HOST,
				port: DATABASE_PORT,
				username: DATABASE_USER,
				password: DATABASE_PASSWORD,
				database: DATABASE,
				autoLoadEntities: true,
				synchronize: false,
				migrations: [
					__dirname + '/shared/modules/typeorm/migrations/*.{ts,js}'
				],
				migrationsTableName: 'migrations_typeorm',
				migrationsRun: false
			})
		}),
		TypeOrmModule.forFeature([
			CompilerEntity,
			ImplementancionEntity,
			FunctionEntity,
			CompilerImplementancionEntity,
			CompilerFunctionEntity,
			DirectiveFunctionEntity,
			DirectiveEntity,
			OpenMPEntity,
			DirectiveOpenMpEntity
		])
	],
	controllers: [],
	providers: []
})
export class AppModule {}
