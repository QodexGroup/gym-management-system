import Layout from '../components/layout/Layout';
import SubscriptionContent from '../components/subscription/SubscriptionContent';

const Subscription = () => (
  <Layout title="Subscription" subtitle="Manage your plan and billing">
    <SubscriptionContent defaultTab="my-plan" />
  </Layout>
);

export default Subscription;
