'use client';

import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function TailwindDemo() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Tailwind CSS Components Demo</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="small">Small</Button>
          <Button size="large">Large</Button>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-medium">Card Title</h3>
            </CardHeader>
            <CardContent>
              <p>This is a basic card with header, content and footer sections using Tailwind CSS.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button size="small" variant="ghost">Cancel</Button>
              <Button size="small">Submit</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Product Card</h3>
              <Badge variant="primary">New</Badge>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Product description goes here with detailed information about features and benefits.</p>
              <p className="text-lg font-bold">$99.99</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Add to Cart</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Tailwind Utilities Demo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow flex flex-col items-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl">1</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Responsive Grid</h3>
            <p className="text-center text-gray-600">Using Tailwind's responsive modifiers for different screen sizes</p>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl">2</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Color System</h3>
            <p className="text-center text-gray-600">Taking advantage of Tailwind's extensive color palette</p>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg shadow flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl">3</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Spacing & Layout</h3>
            <p className="text-center text-gray-600">Using Tailwind's spacing and layout utilities effectively</p>
          </div>
        </div>
      </section>
    </div>
  );
} 