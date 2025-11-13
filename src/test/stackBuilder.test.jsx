import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractionHeatmap from '../components/InteractionHeatmap';
import StackBuilder from '../components/StackBuilder';
import SideEffectProfile from '../components/SideEffectProfile';
import AncillaryCalculator from '../components/AncillaryCalculator';
import { compoundData } from '../data/compoundData';
import { defaultProfile } from '../utils/personalization';

/**
 * Integration Tests for New UI Components
 * Tests user interactions, state management, and component integration
 */

const renderWithAct = async (ui) => {
  let utils;
  await act(async () => {
    utils = render(ui);
  });
  await act(async () => {});
  return utils;
};

describe('InteractionHeatmap Component', () => {
  it('should render the heatmap with compound names', async () => {
    const { container } = await renderWithAct(<InteractionHeatmap />);
    
    // Check if component renders
    expect(container).toBeDefined();
    
    // Check if compound names appear (at least a few)
    expect(screen.getAllByText(/Test/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/NPP/i).length).toBeGreaterThan(0);
  });

  it('should display interaction cells with symbols', async () => {
    const { container } = await renderWithAct(<InteractionHeatmap />);
    
    // Check if any interactive cells exist (they render as divs with onClick, not buttons)
    const allText = container.textContent;
    
    // Should have interaction symbols
    const hasSymbols = allText.includes('✓') || allText.includes('~') || allText.includes('⚠️');
    expect(hasSymbols).toBe(true);
  });

  it('should show rating legend', async () => {
    await renderWithAct(<InteractionHeatmap />);
    
    // Should show rating labels
    expect(screen.getByText(/Excellent Synergy/i)).toBeDefined();
    expect(screen.getByText(/Good Compatibility/i)).toBeDefined();
    expect(screen.getByText(/Compatible/i)).toBeDefined();
  });
});

describe('StackBuilder Component', () => {
  it('should render the stack builder interface', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    
    expect(screen.getByText(/Build Your Stack/i)).toBeDefined();
    expect(screen.getByText(/Current Stack/i)).toBeDefined();
    expect(screen.getByLabelText(/Select Compound/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Add to Stack/i })).toBeDefined();
  });

  it('should show empty stack message initially', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    
    expect(screen.getByText(/No compounds in stack/i)).toBeDefined();
  });

  it('should enable Add button only when compound and dose are selected', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    
    // Initially disabled
    expect(addButton.disabled).toBe(true);
    
    // Select compound
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    await waitFor(() => {
      expect(addButton.disabled).toBe(true);
    });
    
    // Enter dose
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    // Should be enabled now
    await waitFor(() => {
      expect(addButton.disabled).toBe(false);
    });
  });

  it('should add compound to stack when Add button is clicked', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Select testosterone
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    // Enter dose
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    // Click Add
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Should see testosterone in the stack
    await waitFor(() => {
      expect(screen.getByText(/Testosterone/i)).toBeDefined();
    });
  });

  it('should display stack metrics when compounds are added', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Add testosterone
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Should show stack metrics
    await waitFor(() => {
      expect(screen.getByText(/Stack Metrics/i)).toBeDefined();
      expect(screen.getByText(/Total Benefit/i)).toBeDefined();
      expect(screen.getByText(/Total Risk/i)).toBeDefined();
      expect(screen.getAllByText(/Benefit Synergy/i).length).toBeGreaterThan(0);
    });
  });

  it('should display ancillary protocol when compounds are added', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Add testosterone
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Should show ancillary protocol
    await waitFor(() => {
      expect(screen.getByText(/Required Ancillary Protocol/i)).toBeDefined();
    });
  });

  it('should allow removing compounds from stack', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Add testosterone
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Remove testosterone
    await waitFor(async () => {
      const removeButton = screen.getByRole('button', { name: /Remove/i });
      await act(async () => {
        await user.click(removeButton);
      });
    });
    
    // Should show empty stack message again
    await waitFor(() => {
      expect(screen.getByText(/No compounds in stack/i)).toBeDefined();
    });
  });

  it('should allow updating dose for compounds in stack', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Add testosterone
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Verify compound was added and dose input is present
    await waitFor(() => {
      const stackDoseInputs = screen.getAllByRole('spinbutton');
      expect(stackDoseInputs.length).toBeGreaterThan(0);
    });
    
    const stackDoseInputs = screen.getAllByRole('spinbutton');
    await act(async () => {
      await user.clear(stackDoseInputs[0]);
      await user.type(stackDoseInputs[0], '600');
    });
  });

  it('should calculate synergy for multi-compound stacks', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Add testosterone
    let select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    let doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    let addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Add NPP
    await waitFor(async () => {
      select = screen.getByLabelText(/Select Compound/i);
      await act(async () => {
        await user.selectOptions(select, 'npp');
      });
      
      doseInput = screen.getByPlaceholderText(/Enter dose/i);
      await act(async () => {
        await user.type(doseInput, '300');
      });
      
      addButton = screen.getByRole('button', { name: /Add to Stack/i });
      await act(async () => {
        await user.click(addButton);
      });
    });
    
    // Should show synergy calculations
    await waitFor(() => {
      const synergyTexts = screen.getAllByText(/Benefit Synergy/i);
      expect(synergyTexts.length).toBeGreaterThan(0);
    });
  });

  it('should show PDF export button when stack has compounds', async () => {
    await renderWithAct(<StackBuilder userProfile={defaultProfile} />);
    const user = userEvent.setup();
    
    // Add testosterone
    const select = screen.getByLabelText(/Select Compound/i);
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    const doseInput = screen.getByPlaceholderText(/Enter dose/i);
    await act(async () => {
      await user.type(doseInput, '500');
    });
    
    const addButton = screen.getByRole('button', { name: /Add to Stack/i });
    await act(async () => {
      await user.click(addButton);
    });
    
    // Should show PDF export button
    await waitFor(() => {
      expect(screen.getByText(/Export PDF Report/i)).toBeDefined();
    });
  });
});

describe('SideEffectProfile Component', () => {
  it('should render compound selector', () => {
    render(<SideEffectProfile />);
    
    expect(screen.getByText(/Select Compound/i)).toBeDefined();
    expect(screen.getByRole('combobox')).toBeDefined();
  });

  it('should show compound selector', () => {
    render(<SideEffectProfile />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
  });

  it('should display side effects when compound is selected', async () => {
    render(<SideEffectProfile />);
    const user = userEvent.setup();
    
    const select = screen.getByRole('combobox');
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    // Should show side effect categories
    await waitFor(() => {
      expect(screen.getByText(/Common Side Effects/i) || screen.getByText(/Side Effect/i)).toBeDefined();
    });
  });

  it('should display different profiles for different compounds', async () => {
    render(<SideEffectProfile />);
    const user = userEvent.setup();
    
    const select = screen.getByRole('combobox');
    
    // Select testosterone
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Testosterone/i).length).toBeGreaterThan(0);
    });
    
    // Select trenbolone
    await act(async () => {
      await user.selectOptions(select, 'trenbolone');
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Trenbolone/i).length).toBeGreaterThan(0);
    });
  });

  it('should show detailed side effect information', async () => {
    render(<SideEffectProfile />);
    const user = userEvent.setup();
    
    const select = screen.getByRole('combobox');
    await act(async () => {
      await user.selectOptions(select, 'testosterone');
    });
    
    // Should show detailed information (checking for common sections)
    await waitFor(() => {
      const content = screen.getAllByText(/Testosterone/i);
      expect(content.length).toBeGreaterThan(0);
    });
  });
});

describe('AncillaryCalculator Component', () => {
  it('should render ancillary reference', () => {
    render(<AncillaryCalculator />);
    
    expect(screen.getByText(/Ancillary Medications Reference/i)).toBeDefined();
  });

  it('should display ancillary categories', () => {
    render(<AncillaryCalculator />);
    
    // Should show at least some ancillary medication names
    const allText = screen.getAllByText(/./);
    const hasAncillaries = allText.some(el => 
      el.textContent.includes('Anastrozole') ||
      el.textContent.includes('Cabergoline') ||
      el.textContent.includes('TUDCA')
    );
    
    expect(hasAncillaries).toBe(true);
  });

  it('should show dosing information for ancillaries', () => {
    render(<AncillaryCalculator />);
    
    // Should contain dosing text
    const allText = screen.getAllByText(/./);
    const hasDosing = allText.some(el => 
      el.textContent.toLowerCase().includes('dosing') ||
      el.textContent.toLowerCase().includes('mg') ||
      el.textContent.toLowerCase().includes('dose')
    );
    
    expect(hasDosing).toBe(true);
  });

  it('should display cost information', () => {
    render(<AncillaryCalculator />);
    
    // Should show cost information
    const allText = screen.getAllByText(/./);
    const hasCost = allText.some(el => 
      el.textContent.toLowerCase().includes('cost') ||
      el.textContent.includes('$')
    );
    
    expect(hasCost).toBe(true);
  });

  it('should show mechanism information for ancillaries', () => {
    render(<AncillaryCalculator />);
    
    // Should contain mechanism text
    const allText = screen.getAllByText(/./);
    const hasMechanism = allText.some(el => 
      el.textContent.toLowerCase().includes('mechanism')
    );
    
    expect(hasMechanism).toBe(true);
  });
});

describe('Component Integration', () => {
  it('should handle compound data correctly across components', () => {
    // Verify compound data is available
    expect(compoundData).toBeDefined();
    expect(Object.keys(compoundData).length).toBeGreaterThan(0);
    
    // Verify all compounds have required fields
    Object.values(compoundData).forEach(compound => {
      expect(compound.name).toBeDefined();
      expect(compound.abbreviation).toBeDefined();
      expect(compound.type).toBeDefined();
      expect(compound.benefitCurve).toBeDefined();
      expect(compound.riskCurve).toBeDefined();
    });
  });

  it('should have consistent compound IDs across components', () => {
    const compoundKeys = Object.keys(compoundData);
    
    // All keys should be lowercase
    compoundKeys.forEach(key => {
      expect(key).toBe(key.toLowerCase());
    });
    
    // Should have both injectables and orals
    const injectables = compoundKeys.filter(key => compoundData[key].type === 'injectable');
    const orals = compoundKeys.filter(key => compoundData[key].type === 'oral');
    
    expect(injectables.length).toBeGreaterThan(0);
    expect(orals.length).toBeGreaterThan(0);
  });
});
