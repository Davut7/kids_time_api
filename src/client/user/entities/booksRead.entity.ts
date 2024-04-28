import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../helpers/entities/baseEntity.entity';
import { UserEntity } from './user.entity';
import { BooksEntity } from '../../../books/entities/books.entity';

@Entity({ name: 'client_read_books' })
export class BooksReadEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'uuid', nullable: false })
  bookId: string;

  @ManyToOne(() => UserEntity, (user) => user.booksRead, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @ManyToOne(() => BooksEntity, (book) => book.readBy, {
    onDelete: 'CASCADE',
  })
  book: BooksEntity;
}
