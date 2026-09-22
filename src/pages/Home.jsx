import Hero from '../components/Hero'
import Categories from '../components/Categories'
import ProductSection from '../components/ProductSection'
import { products, categories } from '../data/data'

const Home = () => {
  return (
    <div>
      <Hero />
      <Categories categories={categories.filter(c => c.id > 1)} />
      <ProductSection title="Editor's Picks" products={products.editorsPicks} to="/shop" />
      <ProductSection title="Trending Now" products={products.trending} to="/shop?sort=reviews" />
      <ProductSection title="Best Sellers" products={products.bestSellers} to="/shop?sort=rating" />
    </div>
  )
}

export default Home
