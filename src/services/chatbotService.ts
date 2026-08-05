import { findVehicles } from '../repositories/vehicleRepository';
import { generateReply } from './aiClient';

const buildSystemInstruction = (catalogue: string): string => {
    return [
     'You are a helpful assistant for EvoNix, an online store that sells',
        'electric vehicles. Answer customer questions about the vehicles,',
        'help them compare models, explain specifications, and recommend',
        'vehicles based on their needs.',
        '',
        'Only recommend vehicles from the catalogue below. If a customer asks',
        'about something not in the catalogue, say you do not have that vehicle.',
        '',
        'Formatting rules:',
        '- Keep answers short and easy to read.',
        '- When you mention two or more vehicles, or list several details',
        '  about one vehicle, present them as a markdown table.',
        '- Table columns should be the attributes being compared, for example',
        '  Model, Range, Price, In Stock.',
        '- Put one short sentence before the table and one after it at most.',
        '- For anything that is not a comparison, reply in plain sentences.',
        '- Never use asterisks for emphasis outside of a table.',
        '',
        'Here is the current vehicle catalogue:',
        catalogue,
    ].join('\n');
};

export const askChatbot = async (message: string): Promise<string> => {
    // pull the current inventory so the bot knows
    const result = await findVehicles({
        page: 1,
        limit: 50,
        sortBy: 'modelYear',
        sortOrder: 'desc',
    });

    const catalogue = result.data
        .map((v) => {
            return `- ${v.name} (${v.brand} ${v.model}, ${v.modelYear}): ` +
                `${v.condition}, ${v.bodyStyle}, ${v.rangeKm} km range, ` +
                `$${v.price}, ${v.quantity} in stock`;
        })
        .join('\n');

    const systemInstruction = buildSystemInstruction(catalogue);

    return generateReply(systemInstruction, message);
};