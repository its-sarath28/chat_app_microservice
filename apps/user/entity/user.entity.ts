import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { RefreshToken } from './refreshToken.entity';
import { Block } from './block.entity';
import { Friendship } from './friendship.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: null })
  imageUrl?: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @OneToMany(() => Block, (block) => block.blockerId, { cascade: true })
  blockedUsers: Block[];

  @OneToMany(() => Block, (block) => block.blockedId, { cascade: true })
  blockedByUsers: Block[];

  @OneToMany(() => Friendship, (friendship) => friendship.user)
  friendships: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.friend)
  friendOf: Friendship[];
}
