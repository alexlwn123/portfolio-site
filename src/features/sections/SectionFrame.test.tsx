import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SectionFrame } from './SectionFrame'
import styles from './SectionFrame.module.css'

describe('SectionFrame', () => {
  it('is a section named by its title, on the surface it was given', () => {
    render(<SectionFrame id="work" surface="mat" title={['Career', 'path']} />)

    // jsdom's name computation drops the space that ends each line of the title.
    const section = screen.getByRole('region', { name: /^Career\s*path$/ })
    expect(section.tagName).toBe('SECTION')
    expect(section.id).toBe('work')
    expect(section).toHaveAttribute('data-section', 'work')
    expect(section).toHaveAttribute('data-surface', 'mat')
    expect(section).toHaveClass(styles.frame ?? '', styles.mat ?? '')
  })

  it('prints the title as one h2 over two lines', () => {
    render(<SectionFrame id="wins" surface="lid" title={['Hackathon', 'wins']} />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.id).toBe('wins-title')
    expect(heading.textContent).toBe('Hackathon wins ')
    expect(heading.querySelector('br')).toBeNull()
  })

  it('writes the kicker under the title when there is one', () => {
    const { rerender } = render(<SectionFrame id="wins" surface="lid" title={['Wins', '']} />)
    expect(screen.queryByText('newest first')).toBeNull()

    rerender(<SectionFrame id="wins" surface="lid" title={['Wins', '']} kicker="newest first" />)
    expect(screen.getByText('newest first')).toBeInTheDocument()
  })

  it('holds what it is given, inside the part that sets the design unit', () => {
    render(
      <SectionFrame id="projects" surface="mat" title={['Things', 'I built']}>
        <p>Plinko with sats.</p>
      </SectionFrame>,
    )

    const body = screen.getByText('Plinko with sats.').parentElement
    expect(body).toHaveAttribute('data-section-body')
    expect(body?.closest('[data-units]')).not.toBeNull()
  })
})
