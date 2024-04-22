import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { DrawingsAttributesEntity } from './drawingsAttributes.entity';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { UserFavoritesEntity } from '../../favorites/entities/favorites.entity';
import { MediaEntity } from '../../media/entities/mediaEntity';

@Entity({ name: 'drawings' })
@Index('IDX_DRAWINGS_CATEGORY_ID', ['categoryId'])
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
