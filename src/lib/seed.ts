import { supabase } from './supabase'

export async function seedDemoData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn('No authenticated user – skipping seed')
    return
  }

  const uid = user.id

  // Seed a conversation
  const { data: conv } = await supabase.from('conversations').insert({
    user_id: uid,
    title: 'Demo Chat',
    model: 'gpt-4o-mini',
  }).select().single()

  if (conv) {
    await supabase.from('messages').insert([
      { conversation_id: conv.id, role: 'user', content: 'What is DiekAI Workbench?' },
      { conversation_id: conv.id, role: 'assistant', content: 'DiekAI Workbench is a powerful AI productivity platform built by DiekerIT, featuring chat, research, document generation, presentations, file analysis, and custom agent building.' },
    ])
  }

  // Seed a document
  await supabase.from('documents').insert({
    user_id: uid,
    title: 'Welcome to DiekAI',
    type: 'blog',
    content: '# Welcome to DiekAI Workbench\n\nThis is your AI-powered productivity hub. Explore all modules from the sidebar.',
  })

  // Seed a research task
  await supabase.from('research_tasks').insert({
    user_id: uid,
    topic: 'Benefits of AI in enterprise workflows',
    status: 'completed',
    result: JSON.stringify({
      summary: 'AI significantly improves enterprise workflows through automation and insights.',
      key_findings: ['40% time savings on repetitive tasks', 'Improved decision making with data analysis', 'Enhanced customer experience'],
      pros: ['Efficiency gains', 'Cost reduction', 'Scalability'],
      cons: ['Initial investment', 'Change management required'],
      risks: ['Data privacy concerns', 'Over-reliance on automation'],
      recommendation: 'Adopt AI incrementally with proper governance frameworks.',
    }),
  })

  // Seed an agent
  await supabase.from('agents').insert({
    user_id: uid,
    name: 'Code Reviewer',
    description: 'Reviews code for quality and best practices',
    system_prompt: 'You are an expert code reviewer. Analyze code for bugs, performance issues, and best practices. Provide constructive feedback.',
    model: 'gpt-4o-mini',
    allowed_tools: ['code_analysis', 'search'],
  })

  console.log('Demo data seeded successfully')
}
