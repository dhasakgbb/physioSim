import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import InteractionHeatmap from '../InteractionHeatmap';
import { defaultProfile } from '../../utils/personalization';

vi.mock('../PDFExport', () => ({
  default: () => <div data-testid="pdf-export-mock" />
}));

describe('InteractionHeatmap component', () => {
  it('renders heatmap and optimizer blocks', () => {
    const { getByText, asFragment } = render(
      <InteractionHeatmap userProfile={defaultProfile} onPrefillStack={vi.fn()} />
    );
    expect(getByText(/Interaction Matrix/i)).toBeTruthy();
    expect(getByText(/Multi-Compound Optimizer/i)).toBeTruthy();
    expect(asFragment()).toMatchSnapshot();
  });
});
