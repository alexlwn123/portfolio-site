import type { FunctionComponent } from 'react'

import type { DrawnKind } from '../projectStickers'
import { Capsule } from './Capsule'
import { CargoCrate } from './CargoCrate'
import { ChessKnight } from './ChessKnight'
import type { DrawingProps } from './drawing'
import { FiniteComputer } from './FiniteComputer'
import { MintCandy } from './MintCandy'
import { PayTree } from './PayTree'
import { PlinkoBoard } from './PlinkoBoard'
import { PostageStamp } from './PostageStamp'
import { PuzzlePiece } from './PuzzlePiece'
import { Ramp } from './Ramp'
import { Shield } from './Shield'
import { SpeechBubble } from './SpeechBubble'
import { Ticket } from './Ticket'

export type { DrawingProps } from './drawing'

/** The drawing for each shape the section cuts. */
export const DRAWINGS: Readonly<Record<DrawnKind, FunctionComponent<DrawingProps>>> = Object.freeze(
  {
    bubble: SpeechBubble,
    capsule: Capsule,
    computer: FiniteComputer,
    crate: CargoCrate,
    knight: ChessKnight,
    mint: MintCandy,
    plinko: PlinkoBoard,
    puzzle: PuzzlePiece,
    ramp: Ramp,
    shield: Shield,
    stamp: PostageStamp,
    ticket: Ticket,
    tree: PayTree,
  },
)
