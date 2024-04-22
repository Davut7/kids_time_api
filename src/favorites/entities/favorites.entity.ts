import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';
import { UserEntity } from '../../client/user/entities/user.entity';
import { BooksEntity } from '../../books/entities/books.entity';
import { DrawingsEntity } from '../../drawings/entities/drawings.entity';

@Entity({ name: 'user_favorites' })
export class UserFavoritesEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  bookId: string;

  @Column({ type: 'uuid', nullable: true })
  drawingId: string;

  @ManyToOne(() => UserEntity, (user) => user.favorites)
  user: UserEntity;

  @ManyToOne(() => BooksEntity, (book) => book.favorites)
  book: BooksEntity;

  @ManyToOne(() => DrawingsEntity, (drawing) => drawing.favorites)
  drawing: DrawingsEntity;
}
