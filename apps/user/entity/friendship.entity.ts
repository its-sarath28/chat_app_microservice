import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from './user.entity';

import { FRIENDSHIP_STATUS } from '../enum/user.enum';

@Entity()
@Unique(['user', 'friend'])
@Check(`"userId" <> "friendId"`)
export class Friendship {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.friendships, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, (user) => user.friendOf, { onDelete: 'CASCADE' })
  friend: User;

  @Column({ default: FRIENDSHIP_STATUS.PENDING })
  status: FRIENDSHIP_STATUS;

  @CreateDateColumn()
  createdAt: Date;
}
