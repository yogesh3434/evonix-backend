import { calculateLoan } from '../src/services/loanService';
import { AppError } from '../src/errors/AppError';

describe('Loan Calculator', () => {
    it('TC-038: calculates monthly payment for a standard loan', () => {
        const result = calculateLoan(50000, 6, 60);

        expect(result.monthlyPayment).toBe(966.64);
        expect(result.totalPaid).toBe(57998.4);
        expect(result.totalInterest).toBe(7998.4);
    });

    it('TC-039: handles 0% interest as simple division', () => {
        const result = calculateLoan(50000, 0, 60);

        expect(result.monthlyPayment).toBe(833.33);
        expect(result.totalInterest).toBe(0);
    });

    it('TC-040: rejects a negative principal', () => {
        expect(() => calculateLoan(-5000, 6, 60)).toThrow(AppError);
    });

    it('TC-041: rejects a zero term', () => {
        expect(() => calculateLoan(50000, 6, 0)).toThrow(AppError);
    });
});