import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Lanyard } from './Lanyard'

describe('Lanyard', () => {
  it('prints each strap’s words over and over, a drawn star after each', () => {
    const { container } = render(
      <Lanyard left={['alex.lwn.lol', 'ATL']} right={['HACK', 'ORGANIZE', 'REPEAT']} />,
    )
    const [left, right] = [...container.children]

    expect(container.children).toHaveLength(2)
    expect(left?.textContent.startsWith('alex.lwn.lolATLalex.lwn.lolATL')).toBe(true)
    expect(right?.textContent.startsWith('HACKORGANIZEREPEATHACK')).toBe(true)
    expect(left?.querySelectorAll('svg')).toHaveLength(
      left?.querySelectorAll('span > span > span').length ?? 0,
    )
    expect(container.textContent).not.toMatch(/[✦★]/)
  })
})
