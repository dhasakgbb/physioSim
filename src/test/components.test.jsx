import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ViewToggle from '../components/ViewToggle';
import CustomLegend from '../components/CustomLegend';

describe('Component Tests', () => {
  describe('ViewToggle', () => {
    it('should render all spotlight modes', () => {
      const setViewMode = vi.fn();
      render(<ViewToggle viewMode="benefit" setViewMode={setViewMode} />);
      
      expect(screen.getByText('Benefit Curve')).toBeInTheDocument();
      expect(screen.getByText('Risk Curve')).toBeInTheDocument();
      expect(screen.getByText('Efficiency Mode')).toBeInTheDocument();
      expect(screen.getByText('Uncertainty')).toBeInTheDocument();
    });

    it('should call setViewMode when clicked', () => {
      const setViewMode = vi.fn();
      render(<ViewToggle viewMode="benefit" setViewMode={setViewMode} />);
      
      const riskOption = screen.getByText('Risk Curve');
      fireEvent.click(riskOption);
      expect(setViewMode).toHaveBeenCalledWith('risk');
    });

    it('should check active view mode radio button', () => {
      const setViewMode = vi.fn();
      render(<ViewToggle viewMode="benefit" setViewMode={setViewMode} />);
      
      const benefitRadio = screen.getByLabelText(/benefit curve/i);
      expect(benefitRadio).toBeChecked();
    });
  });

  describe('CustomLegend', () => {
    it('should render compound abbreviations', () => {
      const visibleCompounds = {
        testosterone: true,
        npp: true,
        trenbolone: true,
        eq: true,
        masteron: true,
        primobolan: true
      };
      const toggleCompound = vi.fn();
      const onMethodologyClick = vi.fn();
      
      render(
        <CustomLegend
          visibleCompounds={visibleCompounds}
          toggleCompound={toggleCompound}
          onMethodologyClick={onMethodologyClick}
          activeTab="injectables"
        />
      );
      
      // Check for abbreviations
      expect(screen.getAllByText(/Test/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/NPP/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tren/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/EQ/).length).toBeGreaterThan(0);
    });

    it('should call toggleCompound when compound clicked', () => {
      const visibleCompounds = { testosterone: true };
      const toggleCompound = vi.fn();
      const onMethodologyClick = vi.fn();
      
      render(
        <CustomLegend
          visibleCompounds={visibleCompounds}
          toggleCompound={toggleCompound}
          onMethodologyClick={onMethodologyClick}
          activeTab="injectables"
        />
      );
      
      fireEvent.click(screen.getByText('Test'));
      expect(toggleCompound).toHaveBeenCalledWith('testosterone');
    });

    it('should call onMethodologyClick when methodology button clicked', () => {
      const visibleCompounds = { testosterone: true };
      const toggleCompound = vi.fn();
      const onMethodologyClick = vi.fn();
      
      render(
        <CustomLegend
          visibleCompounds={visibleCompounds}
          toggleCompound={toggleCompound}
          onMethodologyClick={onMethodologyClick}
          activeTab="injectables"
        />
      );
      
      const methodologyButtons = screen.getAllByText('ⓘ');
      fireEvent.click(methodologyButtons[0]);
      expect(onMethodologyClick).toHaveBeenCalled();
    });
  });
});

