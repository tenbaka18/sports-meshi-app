import { GoogleGenAI, Type } from "@google/genai";
import { Profile, Ingredient, Recipe } from '../types';

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeIngredients = async (imageFiles: File[]): Promise<Ingredient[]> => {
    const imageParts = await Promise.all(imageFiles.map(fileToGenerativePart));

    const prompt = `
      あなたは専門の食品認識AIです。提供された画像を分析し、含まれている可能性のある全ての食材を特定してください。
      結果は必ずJSON形式の配列で返してください。各オブジェクトは "name"（日本語の食材名）と "confidence"（0から1の確信度）の2つのキーを持つ必要があります。
      食材名は正規化（例：「タマネギ」「玉ねぎ」を「玉ねぎ」に統一）し、重複は統合してください。
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, ...imageParts] }
    });
    
    const jsonString = response.text.trim().replace(/```json|```/g, '');
    try {
        const parsedResult = JSON.parse(jsonString);
        if (Array.isArray(parsedResult)) {
            return parsedResult as Ingredient[];
        }
        throw new Error("Parsed result is not an array");
    } catch (e) {
        console.error("Failed to parse Gemini response:", jsonString, e);
        throw new Error("AIからの応答を解析できませんでした。");
    }
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        mealName: { type: Type.STRING, description: "献立名（例：疲労回復！スタミナ満点定食）" },
        mainDish: { type: Type.STRING, description: "主菜の料理名" },
        sideDish: { type: Type.STRING, description: "副菜の料理名" },
        soup: { type: Type.STRING, description: "汁物の料理名" },
        stapleAmount: { type: Type.STRING, description: "主食（ご飯など）の量の目安を、子供の手のひらサイズで表現（例：子供の手のひら1.5杯分）" },
        cookTime: { type: Type.STRING, description: "全体の調理にかかる時間（例：約20分）" },
        nutrition: {
            type: Type.OBJECT,
            properties: {
                energy: { type: Type.STRING, description: "総エネルギー（例：約650kcal）" },
                protein: { type: Type.STRING, description: "たんぱく質量（例：約30g）" },
                fat: { type: Type.STRING, description: "脂質量（例：約20g）" },
                carbs: { type: Type.STRING, description: "炭水化物量（例：約80g）" },
            },
            required: ["energy", "protein", "fat", "carbs"]
        },
        nutritionistComment: { type: Type.STRING, description: "この献立がなぜ運動後の子供に適しているかの栄養士からのコメント" },
        shoppingList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "利用可能な食材以外で、追加購入が必要な食材のリスト" },
        alternativeIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "特定の食材がない場合の代替案のリスト" },
        tipsForKids: { type: Type.STRING, description: "子供が食べやすくなるような工夫や声かけのポイント" },
    },
    required: ["mealName", "mainDish", "sideDish", "soup", "stapleAmount", "cookTime", "nutrition", "nutritionistComment", "shoppingList", "alternativeIngredients", "tipsForKids"]
};


export const generateRecipe = async (profiles: Profile[], ingredients: string[], recentRecipeNames: string[] = []): Promise<Recipe> => {
    const systemInstruction = `あなたは、スポーツを頑張る小学生の子どもを持つ保護者向けの管理栄養士です。あなたの役割は、提供された食材リストと家族のプロフィールに基づき、栄養バランスが良く、子どもの成長と運動後の回復をサポートする夕食の献立を提案することです。以下のルールを厳密に守ってください。

# あなたのペルソナ
- 専門的でありながら、親しみやすく、安心感を与える優しい口調で話します。
- 保護者の忙しさを理解し、簡単で実践的なアドバイスを心がけます。

# レシピ生成の厳格なルール
1.  **対象者**: プロフィールに記載された全ての小学生。年齢や運動量の違いを考慮し、全員に適した献立を考えること。プロフィールがない場合は、一般的な小学生（10歳、運動量中程度）を想定すること。
2.  **目的**: 運動後の疲労回復と成長促進
3.  **難易度**: ユーザーが指定した難易度（Easy, Normal, Advanced）に応じて、レシピの複雑さ、工程数、調理時間を調整してください。「Easy」は初心者向け、「Normal」は標準的、「Advanced」は料理に慣れた人向けです。
4.  **時間**: 全ての調理が20分以内で完了すること。これは「Normal」の場合の目安とし、難易度に応じて調整してください。
5.  **栄養目標**:
    - 総エネルギー: 500〜750kcal
    - たんぱく質: 20〜40g
    - 脂質: 総エネルギーの20〜30%
    - 塩分: 2.5g以下
6.  **重点栄養素**: 鉄分、カルシウム、ビタミンCを豊富に含む食材を積極的に活用する。
7.  **献立構成**: 主菜、副菜、汁物の3品構成を基本とする。主食（ご飯など）の量は子どもの手のひらサイズで表現する。
8.  **調理器具**: 一般的な家庭にある器具（フライパン、炊飯器、電子レンジ、オーブントースター）のみを使用する前提でレシピを考案する。
9.  **食材**: 提供された食材リストを最大限活用する。リストにない食材を追加する必要がある場合は、「買い足し食材リスト」に含める。食材の指定がない場合は、旬の食材や一般家庭によくある食材を活用して提案すること。
10. **アレルギーと苦手**: 提供されたアレルギー情報と苦手な食材は、レシピ、代替案、買い足しリストの全てから完全に除外する。これは最優先事項であり、複数の子供がいる場合は全員の除外食材を考慮すること。
11. **出力形式**: 厳密にJSON形式で、日本語で回答してください。他のテキストは一切含めないでください。`;

    const profilesSummary = profiles.length > 0 
        ? profiles.map(p => `- ${p.name} (${p.age}歳, 運動強度: ${p.exerciseIntensity}, 希望難易度: ${p.difficulty})`).join('\n')
        : '指定なし。一般的な小学生（10歳、運動量は中程度、難易度Normal）を想定してください。';
    
    const ingredientsSummary = ingredients.length > 0
        ? ingredients.join(', ')
        : '指定なし。旬の食材や一般家庭によくある食材を活用してください。';

    const recentRecipesSummary = recentRecipeNames.length > 0
        ? `\n【最近作ったレシピ】\n以下のレシピは最近作ったので、これらとは異なるものを提案してください:\n- ${recentRecipeNames.join('\n- ')}`
        : '';

    const allDisliked = [...new Set(profiles.flatMap(p => p.dislikedIngredients.split(/\s+/).map(s => s.trim()).filter(Boolean)))];
    const allAllergies = [...new Set(profiles.flatMap(p => p.allergies.split(/\s+/).map(s => s.trim()).filter(Boolean)))];

    const userPrompt = `
      以下の情報に基づいて、全員が食べられる最適な夕食の献立を提案してください。

      【お子様のプロフィール】
      ${profilesSummary}

      【全員に共通で除外する食材】
      - 苦手な食材: ${allDisliked.length > 0 ? allDisliked.join(', ') : 'なし'}
      - アレルギー: ${allAllergies.length > 0 ? allAllergies.join(', ') : 'なし'}

      【利用可能な食材】
      ${ingredientsSummary}
      ${recentRecipesSummary}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: userPrompt }] },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: recipeSchema,
        }
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as Recipe;
    } catch (e) {
        console.error("Failed to parse recipe response:", jsonString, e);
        throw new Error("AIからのレシピ応答を解析できませんでした。");
    }
};