import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricCard from './MetricCard';
import { DollarSign } from 'lucide-react';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(
      <MetricCard
        title="Revenue"
        value="1,234 DH"
        icon={DollarSign}
        iconColor="text-green-400"
        iconBgColor="bg-green-500/20"
      />
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('1,234 DH')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(
      <MetricCard
        title="Revenue"
        value="1,234 DH"
        icon={DollarSign}
        trend={{ value: 'From sales', isPositive: true }}
        iconColor="text-green-400"
        iconBgColor="bg-green-500/20"
      />
    );
    expect(screen.getByText(/From sales/)).toBeInTheDocument();
  });
});
