import { IsNotEmpty } from 'class-validator';
import { BaseEntity as BaseModel, Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, SaveOptions, UpdateDateColumn } from 'typeorm';

export class BaseEntity extends BaseModel {
  //TODO get this to work with repositories without needing the entity instatiated
  public async save(options?: SaveOptions): Promise<this> {
    await super.save(options);
    await this.reload();
    return this;
  }

  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column({ default: true })
  public active: boolean;

  @IsNotEmpty()
  @CreateDateColumn()
  public createdAt: Date;

  @IsNotEmpty()
  @UpdateDateColumn()
  public updatedAt: Date;

  @IsNotEmpty()
  @DeleteDateColumn()
  public deletedAt: Date;
}
