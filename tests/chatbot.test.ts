import { askChatbot } from '../src/services/chatbotService';
import * as aiClient from '../src/services/aiClient';
import * as vehicleRepository from '../src/repositories/vehicleRepository';

jest.mock('../src/services/aiClient');
jest.mock('../src/repositories/vehicleRepository');

const mockedAi = aiClient as jest.Mocked<typeof aiClient>;
const mockedRepo = vehicleRepository as jest.Mocked<typeof vehicleRepository>;

describe('Chatbot Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockedRepo.findVehicles.mockResolvedValue({
            data: [
                {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    name: 'Tesla Model X',
                    brand: 'Tesla',
                    model: 'Model X',
                    modelYear: 2024,
                    condition: 'new',
                    bodyStyle: 'SUV',
                    rangeKm: 560,
                    price: '87000',
                    quantity: 5,
                } as any,
            ],
            total: 1,
            page: 1,
            limit: 50,
            totalPages: 1,
        });
    });

    it('TC-044: returns the AI reply for a customer message', async () => {
        mockedAi.generateReply.mockResolvedValue(
            'The Tesla Model X has a range of 560 km.'
        );

        const reply = await askChatbot('What is the range of the Model X?');

        expect(reply).toBe('The Tesla Model X has a range of 560 km.');
        expect(mockedAi.generateReply).toHaveBeenCalled();
    });

    it('TC-045: includes the vehicle catalogue in the system instruction', async () => {
        mockedAi.generateReply.mockResolvedValue('ok');

        await askChatbot('Recommend a vehicle');

        
        const systemInstruction = mockedAi.generateReply.mock.calls[0][0];
        expect(systemInstruction).toContain('Tesla Model X');
    });
});