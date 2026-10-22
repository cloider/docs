import MDXComponents from '@theme-original/MDXComponents';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import DocCardList from '@theme/DocCardList';
import Screenshot from '@site/src/components/Screenshot';
import FAQ from '@site/src/components/FAQ';
import {Cards, Card} from '@site/src/components/Cards';
import Icon from '@site/src/components/Icon';
import Logos from '@site/src/components/Logos';

// Available in every .md/.mdx page without an import
export default {
  ...MDXComponents,
  Tabs,
  TabItem,
  DocCardList,
  Screenshot,
  FAQ,
  Cards,
  Card,
  Icon,
  Logos,
};
