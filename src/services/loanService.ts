import { AppError } from '../errors/AppError';

export type LoanEstimate = {
    monthlyPayment: number;
    totalPaid: number;
    totalInterest: number;
};

export const calculateLoan = (
    principal: number,
    annualRatePercent: number,
    termMonths: number
): LoanEstimate => {
    if (principal <= 0 || termMonths <= 0 || annualRatePercent < 0) {
        throw new AppError(400, 'Invalid loan parameters');
    }

    const monthlyRate = annualRatePercent / 100 / 12;

    let monthlyPayment: number;

    if (monthlyRate === 0) {
       
        monthlyPayment = principal / termMonths;
    } else {
        
        const factor = Math.pow(1 + monthlyRate, termMonths);
        monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    }

    const totalPaid = monthlyPayment * termMonths;

    return {
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalInterest: Number((totalPaid - principal).toFixed(2)),
    };
};