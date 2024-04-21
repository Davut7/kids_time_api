import { BooksEntity } from 'src/books/entities/books.entity';
import { UserEntity } from 'src/client/user/entities/user.entity';
import { DrawingsEntity } from 'src/drawings/entities/drawings.entity';
import { BaseEntity } from 'src/helpers/entities/baseEntity.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

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
