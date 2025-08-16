"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const OverviewCards_1 = require("../../src/dashboard/components/OverviewCards");
describe('OverviewCards Component', () => {
    const mockData = {
        totalFiles: 150,
        averageScore: 7.8,
        totalViolations: 32,
        improvementTrend: 12.5
    };
    it('renders all overview cards with correct data', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: mockData }));
        expect(react_1.screen.getByText('Total Files')).toBeInTheDocument();
        expect(react_1.screen.getByText('150')).toBeInTheDocument();
        expect(react_1.screen.getByText('Average Quality Score')).toBeInTheDocument();
        expect(react_1.screen.getByText('7.8/10')).toBeInTheDocument();
        expect(react_1.screen.getByText('Total Violations')).toBeInTheDocument();
        expect(react_1.screen.getByText('32')).toBeInTheDocument();
        expect(react_1.screen.getByText('Improvement Trend')).toBeInTheDocument();
        expect(react_1.screen.getByText('+12.5%')).toBeInTheDocument();
    });
    it('displays correct colors for high quality score', () => {
        const highScoreData = { ...mockData, averageScore: 8.5 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: highScoreData }));
        const scoreCard = react_1.screen.getByText('8.5/10').closest('div')?.parentElement;
        expect(scoreCard?.querySelector('.bg-green-50')).toBeInTheDocument();
    });
    it('displays correct colors for medium quality score', () => {
        const mediumScoreData = { ...mockData, averageScore: 6.0 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: mediumScoreData }));
        const scoreCard = react_1.screen.getByText('6.0/10').closest('div')?.parentElement;
        expect(scoreCard?.querySelector('.bg-yellow-50')).toBeInTheDocument();
    });
    it('displays correct colors for low quality score', () => {
        const lowScoreData = { ...mockData, averageScore: 3.5 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: lowScoreData }));
        const scoreCard = react_1.screen.getByText('3.5/10').closest('div')?.parentElement;
        expect(scoreCard?.querySelector('.bg-red-50')).toBeInTheDocument();
    });
    it('displays correct colors for low violations count', () => {
        const lowViolationsData = { ...mockData, totalViolations: 25 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: lowViolationsData }));
        const violationsCard = react_1.screen.getByText('25').closest('div')?.parentElement;
        expect(violationsCard?.querySelector('.bg-green-50')).toBeInTheDocument();
    });
    it('displays correct colors for high violations count', () => {
        const highViolationsData = { ...mockData, totalViolations: 250 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: highViolationsData }));
        const violationsCard = react_1.screen.getByText('250').closest('div')?.parentElement;
        expect(violationsCard?.querySelector('.bg-red-50')).toBeInTheDocument();
    });
    it('displays positive trend with up arrow', () => {
        const positiveTrendData = { ...mockData, improvementTrend: 15.3 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: positiveTrendData }));
        expect(react_1.screen.getByText('+15.3%')).toBeInTheDocument();
        expect(react_1.screen.getByText('📈')).toBeInTheDocument();
    });
    it('displays negative trend with down arrow', () => {
        const negativeTrendData = { ...mockData, improvementTrend: -8.2 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: negativeTrendData }));
        expect(react_1.screen.getByText('-8.2%')).toBeInTheDocument();
        expect(react_1.screen.getByText('📉')).toBeInTheDocument();
    });
    it('displays neutral trend with right arrow', () => {
        const neutralTrendData = { ...mockData, improvementTrend: 0 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: neutralTrendData }));
        expect(react_1.screen.getByText('0.0%')).toBeInTheDocument();
        expect(react_1.screen.getByText('➡️')).toBeInTheDocument();
    });
    it('formats large numbers with commas', () => {
        const largeNumberData = { ...mockData, totalFiles: 1234567 };
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: largeNumberData }));
        expect(react_1.screen.getByText('1,234,567')).toBeInTheDocument();
    });
    it('applies hover effects to cards', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: mockData }));
        const cards = react_1.screen.getAllByRole('generic').filter(el => el.className.includes('hover:shadow-md'));
        expect(cards.length).toBeGreaterThan(0);
    });
    it('displays appropriate icons for each metric', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OverviewCards_1.OverviewCards, { data: mockData }));
        expect(react_1.screen.getByText('📁')).toBeInTheDocument(); // Files icon
        expect(react_1.screen.getByText('⭐')).toBeInTheDocument(); // Score icon
        expect(react_1.screen.getByText('⚠️')).toBeInTheDocument(); // Violations icon
        expect(react_1.screen.getByText('📈')).toBeInTheDocument(); // Trend icon
    });
});
//# sourceMappingURL=OverviewCards.test.js.map