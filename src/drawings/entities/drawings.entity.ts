import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/helpers/entities/baseEntity.entity';
import { MediaEntity } from 'src/media/entities/mediaEntity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { DrawingsAttributesEntity } from './drawingsAttributes.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { UserFavoritesEntity } from 'src/favorites/entities/favorites.entity';

@Entity({ name: 'drawings' })
export class DrawingsEntity extends BaseEntity {
  @ApiProperty({
    title: 'Level to draw',
    name: 'title',
    nullable: false,
  })
  @Column({ type: 'int', nullable: false })
  requiredLevel: number;

  @Column({ type: 'uuid', nullable: false })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.drawing)
  category: CategoryEntity;

  @OneToMany(() => MediaEntity, (media) => media.drawing)
  medias: MediaEntity[];

  @OneToMany(() => DrawingsAttributesEntity, (attribute) => attribute.drawing)
  attributes: DrawingsAttributesEntity[];

  @OneToMany(() => UserFavoritesEntity, (favorites) => favorites.drawing)
  favorites: UserFavoritesEntity[];
}
