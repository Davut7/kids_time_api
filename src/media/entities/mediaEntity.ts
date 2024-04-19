import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/helpers/entities/baseEntity.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';

@Entity({ name: 'medias' })
export class MediaEntity extends BaseEntity {
  @ApiProperty({ description: 'File name', example: 'example.jpg' })
  @Column({ nullable: false })
  fileName: string;

  @ApiProperty({
    description: 'File path',
    example: '/path/to/file/example.jpg',
  })
  @Column({ nullable: false })
  filePath: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/jpeg' })
  @Column({ nullable: false })
  mimeType: string;

  @ApiProperty({ description: 'Size of the file in bytes', example: '1024' })
  @Column({ nullable: false })
  size: string;

  @ApiProperty({
    description: 'Original name of the file',
    example: 'example.jpg',
  })
  @Column({ nullable: false })
  originalName: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.medias)
  category:CategoryEntity
}
