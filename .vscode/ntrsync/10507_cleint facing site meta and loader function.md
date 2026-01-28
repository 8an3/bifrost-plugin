# client facing site meta and loader function

client_facing_site_meta_and_loader_function
import  { type LoaderFunction, type MetaFunction, json } from '@remix-run/node';
import { dealerSelection, fullUserSelection } from '~/utils/loader.server';
import { prisma } from '~/libs';

export async function loader({ request, params }: LoaderFunction) {
    const d = await prisma.dealer.findUnique({ where: { id: 1 }, select: dealerSelection });
    const URLS = { page: 'About Us' };
    return json({
        data: {
            d: d,
            URLS: URLS
        }
    });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const { d, URLS } = data;
    return [
        { title: `${URLS.page} - ${d.dealerName}` },
        { name: "description", keywords: "Automotive Sales, dealership sales, automotive CRM, Service Center, Parts Department, Accessories Department, CRM, Dealership.", content: d.metaDesc, },
    ];
};
