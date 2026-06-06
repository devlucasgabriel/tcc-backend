import { MigrationInterface, QueryRunner } from "typeorm";

export class DirectiveOpenMp1780706086359 implements MigrationInterface {
    name = 'DirectiveOpenMp1780706086359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "directive" DROP CONSTRAINT "FK_07f483c5bbe1322eaa55733ce2c"`);
        await queryRunner.query(`ALTER TABLE "directive" DROP CONSTRAINT "UQ_6215925b8bd11df672babb14894"`);
        await queryRunner.query(`CREATE TABLE "diretive_open_mp" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "directive_id" integer NOT NULL, "open_mp_id" integer NOT NULL, CONSTRAINT "PK_160964d25316ae3c317f8ab541c" PRIMARY KEY ("directive_id", "open_mp_id"))`);
        await queryRunner.query(`ALTER TABLE "directive" DROP COLUMN "open_mp_id"`);
        await queryRunner.query(`ALTER TABLE "directive" ADD CONSTRAINT "UQ_b1ce7d258ba81fd920c2c398fe1" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "diretive_open_mp" ADD CONSTRAINT "FK_cf8df380d1ae5842f0b978a6ec5" FOREIGN KEY ("directive_id") REFERENCES "directive"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "diretive_open_mp" ADD CONSTRAINT "FK_b41b49898728adb2cb2016d0e81" FOREIGN KEY ("open_mp_id") REFERENCES "open_mp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diretive_open_mp" DROP CONSTRAINT "FK_b41b49898728adb2cb2016d0e81"`);
        await queryRunner.query(`ALTER TABLE "diretive_open_mp" DROP CONSTRAINT "FK_cf8df380d1ae5842f0b978a6ec5"`);
        await queryRunner.query(`ALTER TABLE "directive" DROP CONSTRAINT "UQ_b1ce7d258ba81fd920c2c398fe1"`);
        await queryRunner.query(`ALTER TABLE "directive" ADD "open_mp_id" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "diretive_open_mp"`);
        await queryRunner.query(`ALTER TABLE "directive" ADD CONSTRAINT "UQ_6215925b8bd11df672babb14894" UNIQUE ("name", "open_mp_id")`);
        await queryRunner.query(`ALTER TABLE "directive" ADD CONSTRAINT "FK_07f483c5bbe1322eaa55733ce2c" FOREIGN KEY ("open_mp_id") REFERENCES "open_mp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
